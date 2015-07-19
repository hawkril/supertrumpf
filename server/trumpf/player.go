package trumpf

import (
	"trumpf-core/players"
)

type Player struct {
	Player *players.Player
	Deck   *Deck
}

func (this *Player) Lost() bool {
	this.Deck.RLock()
	defer this.Deck.RUnlock()

	return this.Deck.empty()
}
