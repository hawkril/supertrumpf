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

func (this *Player) Seen() {
	this.LastSeen = time.Now()
}

func (this *Player) GetChannel(name string) chan *events.Event {
	if ch, ok := this.Chans[name]; ok {
		return ch
	}
	ch := make(chan *events.Event, 8)
	this.Chans[name] = ch
	return ch
}

func (this *Player) RemoveChannel(name string) {
	if ch, ok := this.Chans[name]; ok {
		delete(this.Chans, name)
		close(ch)
	}
}
