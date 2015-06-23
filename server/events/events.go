package events

import (
	"encoding/xml"
)

type Event struct {
	XMLName xml.Name    `xml:"event"`
	Type    string      `xml:"type"`
	Source  string      `xml:"source"`
	Payload interface{} `xml:"payload"`
}

func New(typ, source string, payload interface{}) *Event {
	return &Event{
		Type:    typ,
		Source:  source,
		Payload: payload,
	}
}
