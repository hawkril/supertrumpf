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
	return err
}

func Query(query string) ([]string, error) {
	result := make([]string, 0, 10)
	var buf string
	var err error

	m.Lock()

	q := client.Query(query)
	buf, err = q.Execute()
	if err != nil {
		m.Unlock()
		return nil, err
	}
	result = append(result, buf)
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
