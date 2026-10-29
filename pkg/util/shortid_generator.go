package util

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"sync"

	"github.com/bwmarrin/snowflake"
	"github.com/google/uuid"
)

const MaxUIDLength = 40

var alphaRunes = []rune("abcdefghijklmnopqrstuvwxyz")
var hexLetters = []rune("abcdef")

var (
	ErrUIDTooLong       = fmt.Errorf("UID is longer than %d symbols", MaxUIDLength)
	ErrUIDFormatInvalid = errors.New("invalid format of UID. Only letters, numbers, '-' and '_' are allowed")
	ErrUIDEmpty         = fmt.Errorf("UID is empty")
)

// Guards the lazy initialization of the snowflake node, which could otherwise
// be created more than once when UIDs are generated concurrently.
var mtx sync.Mutex

// Legacy UID pattern
var validUIDCharPattern = `a-zA-Z0-9\-\_`
var validUIDPattern = regexp.MustCompile(`^[` + validUIDCharPattern + `]*$`).MatchString

// IsValidShortUID checks if short unique identifier contains valid characters
// NOTE: future Grafana UIDs will need conform to https://github.com/kubernetes/apimachinery/blob/master/pkg/util/validation/validation.go#L43
func IsValidShortUID(uid string) bool {
	return validUIDPattern(uid)
}

// IsShortUIDTooLong checks if short unique identifier is too long
func IsShortUIDTooLong(uid string) bool {
	return len(uid) > MaxUIDLength
}

var node *snowflake.Node

// cryptoRandIntn returns a uniformly distributed value in [0, n) from crypto/rand.
// crypto/rand.Reader never returns an error, so it is safe to ignore here.
func cryptoRandIntn(n int64) int64 {
	v, _ := rand.Int(rand.Reader, big.NewInt(n))
	return v.Int64()
}

func randomHexLetter() string {
	return string(hexLetters[cryptoRandIntn(int64(len(hexLetters)))])
}

// GenerateShortUID will generate a UUID that can also be a k8s name
// it is guaranteed to have a character as the first letter
// This UID will be a valid k8s name
func GenerateShortUID() string {
	mtx.Lock()
	defer mtx.Unlock()

	if node == nil {
		// ignoring the error happens when input outside 0-1023
		node, _ = snowflake.NewNode(cryptoRandIntn(1024))
	}

	// Use UUIDs if snowflake failed (should be never)
	if node == nil {
		uuid := uuid.NewString()
		if rune(uuid[0]) < rune('a') {
			uuid = randomHexLetter() + uuid[1:]
		}
		return uuid
	}

	return randomHexLetter() + // start with a letter
		node.Generate().Base36() +
		randomHexLetter() // a bit more entropy
}

// ValidateUID checks the format and length of the string and returns error if it does not pass the condition
func ValidateUID(uid string) error {
	if len(uid) == 0 {
		return ErrUIDEmpty
	}
	if IsShortUIDTooLong(uid) {
		return ErrUIDTooLong
	}
	if !IsValidShortUID(uid) {
		return ErrUIDFormatInvalid
	}
	return nil
}
