package trumpf

import (
	"trumpf-core/players"
)

type Player struct {
	Player *players.Player
	Deck   []*Card
}
