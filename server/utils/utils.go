package utils

import (
	"math/rand"
	"time"
)

const (
	chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
)

var (
	rnd *rand.Rand
)

func init() {
	rnd = rand.New(rand.NewSource(time.Now().Unix()))
}

func GenerateID(n int) string {
	buf := make([]byte, n)
	for n--; n >= 0; n-- {
		buf[n] = chars[rnd.Intn(len(chars))]
	}
	return string(buf)
}

func RandomInt(min, max int) int {
	return rnd.Intn(max-min+1) + min
}

func RandomShuffle(n int) []int {
	return rnd.Perm(n)
}
