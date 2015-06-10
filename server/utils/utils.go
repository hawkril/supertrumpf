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
		buf[n] = chars[rand.Intn(len(chars))]
	}
	return string(buf)
}

func RandomInt(min, max int) int {
	return rand.Intn(max-min+1) + min
}
