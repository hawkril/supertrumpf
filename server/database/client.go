package database

import (
	"sync"

	basex "github.com/noxer/go-basex"
)

var (
	client *basex.BaseXClient
	m      sync.Mutex
)

func Connect(host, user, password string) (err error) {
	client, err = basex.New(host, user, password)
	return
}

func Query(query string) ([]string, error) {
	result := make([]string, 0)
	var buf string
	var err error

	m.Lock()

	q := client.Query(query)
	_, err = q.Execute()
	if err != nil {
		m.Unlock()
		return nil, err
	}
	for q.More() {
		buf, err = q.Next()
		if err != nil {
			m.Unlock()
			return result, err
		}
		result = append(result, buf)
	}

	m.Unlock()
	return result, nil
}
