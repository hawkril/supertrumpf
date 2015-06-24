package trumpf

import (
	"encoding/xml"
	"errors"
	"fmt"

	"trumpf-core/database"
)

type Card struct {
	XMLName xml.Name `xml:"card"`

	Number int    `xml:"no"`
	Title  string `xml:"titel"`
	Values []*Value
}

type Value struct {
	XMLName xml.Name `xml:"value"`

	ID      string `xml:"id,attr"`
	Content string `xml:",chardata"`
}

func QueryCard(setID string, index int) (*Card, error) {
	q, err := database.Query(fmt.Sprintf(`for $x in doc("testdata1/%s")/cardset/cards/card where $x/no=%d return $x`, setID, index))
	if err != nil {
		return nil, err
	}
	if len(q) == 0 {
		return nil, errors.New("Card not found")
	}
	c := &Card{}
	err = xml.Unmarshal([]byte(q[0]), c)
	return c, err
}
