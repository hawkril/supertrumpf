package event

type Event struct {
	Type    string      `xml:"type"`
	Source  string      `xml:"source"`
	Payload interface{} `xml:"payload,omitempty"`
}

func NewEvent(typ, source string, payload interface{}) *Event {
	return &Event{
		Type:    typ,
		Source:  source,
		Payload: payload,
	}
}
