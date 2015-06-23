package trumpf

import (
	"strconv"
	"strings"

	"trumpf-core/database"
)

type Set struct {
	ID    string `xml:"id"`
	Count int    `xml:"count"`
}

func QuerySet(id string) *Set {
	// ToDo: Write an adequate escape
	id = strings.Replace(id, `"`, "", -1)

	rows, err := database.Query(`xquery for $x in doc("testdata1/sets.xml")/sets/set where $x/@name="` + id + `" return data($x/card_count)`)
	if len(rows) == 0 {
		return nil
	}

	i, err := strconv.ParseInt(rows[0], 10, 64)
	if err != nil {
		return nil
	}
	return &Set{
		ID:    id,
		Count: int(i),
	}
}
