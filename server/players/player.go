package players

import (
	"sync"
	"time"

	"trumpf-core/events"
	"trumpf-core/utils"
)

type Player struct {
	sync.RWMutex

	ID       string                        `xml:"id"`
	Name     string                        `xml:"name"`
	Chans    map[string]chan *events.Event `xml:"-"`
	LastSeen time.Time                     `xml:"last-seen"`
}

func NewPlayer(name string) *Player {
	p := &Player{
		ID:    utils.GenerateID(32),
		Name:  name,
		Chans: make(map[string]chan *events.Event),
	}
	m.Lock()
	for !addPlayer(p) {
		p.ID = utils.GenerateID(32)
	}
	m.Unlock()
	return p
}

func (p *Player) Seen() {
	p.LastSeen = time.Now()
}

func (p *Player) GetChannel(name string) chan *events.Event {
	if ch, ok := p.Chans[name]; ok {
		return ch
	}
	ch := make(chan *events.Event, 8)
	p.Chans[name] = ch
	return ch
}

func (p *Player) RemoveChannel(name string) {
	if ch, ok := p.Chans[name]; ok {
		delete(p.Chans, name)
		close(ch)
	}
}
