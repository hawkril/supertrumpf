package trumpf

import (
	"encoding/xml"
	"errors"
	"strings"

	"trumpf-core/database"
)

type Set struct {
	XMLName xml.Name `xml:"set"`

	ID         string         `xml:"name,attr"`
	Title      string         `xml:"title"`
	CardCount  int            `xml:"card_count"`
	MaxPlayers int            `xml:"max_players"`
	Properties []*PropertyDef `xml:"properties>property"`
}

func QuerySet(id string) (*Set, error) {
	// ToDo: Write an adequate escape
	id = strings.Replace(id, `"`, ``, -1)

	rows, err := database.Query(`declare default element namespace "46.4.83.144";for $x in doc("testdata1/sets.xml")/sets/set where $x/@name="` + id + `" return $x`)
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, errors.New("Set not found")
	}
	s := &Set{}
	if err = xml.Unmarshal([]byte(rows[0]), s); err != nil {
		return nil, err
	}

	rows, err = database.Query(`declare default element namespace "46.4.83.144";for $x in doc("testdata1/` + id + `.xml")/cardset/definition/values return $x`)
	if err != nil {
		return nil, err
	}
	wrapper := &PropertyWrapper{}
	err = xml.Unmarshal([]byte(rows[0]), wrapper)
	s.Properties = wrapper.Values
	return s, err
}

func QueryAllSets() ([]*Set, error) {
	rows, err := database.Query(`declare default element namespace "46.4.83.144";for $x in doc("testdata1/sets.xml")/sets/set return $x`)
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, errors.New("No sets found")
	}
	result := make([]*Set, len(rows))
	for i, row := range rows {
		s := &Set{}
		if err = xml.Unmarshal([]byte(row), s); err != nil {
			return nil, err
		}
		result[i] = s
	}
	return result, nil
}
