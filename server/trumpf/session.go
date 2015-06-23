package trumpf

import (
	"trumpf-core/lobbies"
	"trumpf-core/players"
	"trumpf-core/utils"

	"sync"
)

var (
	m sync.RWMutex
	l map[string]*session = make(map[string]*session)
)

type session struct {
	sync.RWMutex

	ID         string    `xml:"id"`
	Players    []*Player `xml:"players"`
	NextPlayer int       `xml:"nextPlayer"`
	Deck       Deck      `xml:"set"`
}

func (this *session) ShufflePlayers() {
	var a, b int
	for range this.Players {
		a = utils.RandomInt(0, len(this.Players))
		b = utils.RandomInt(0, len(this.Players))
		if a == b {
			continue
		}
		this.Players[a], this.Players[b] = this.Players[b], this.Players[a]
	}
}

func (this *session) ShuffleDecks() {
	for _, p := range this.Players {
		shuffleDeck(p.Deck)
	}
}

func shuffleDeck(cards []*Card) {
	var a, b int
	for range cards {
		a = utils.RandomInt(0, len(cards))
		b = utils.RandomInt(0, len(cards))
		if a == b {
			continue
		}
		cards[a], cards[b] = cards[b], cards[a]
	}
}

func StartGame(lobby *lobbies.Lobby) *session {
	ps := make([]*Player, lobby.Players.Len())
	i := 0
	for p := lobby.Players.Front(); p != nil; p = p.Next() {
		ps[i] = &Player{Player: p.Value.(*players.Player)}
		i++
	}

	s := &session{
		ID:      utils.GenerateID(32),
		Players: ps,
	}
	s.ShufflePlayers()
	for !addSession(s) {
		s.ID = utils.GenerateID(32)
	}

	return s
}

func addSession(sess *session) bool {
	if _, ok := l[sess.ID]; ok {
		return false
	}
	l[sess.ID] = sess
	return true
}
