package trumpf

import (
	"trumpf-core/players"
)

type player struct {
	Player *players.Player
	Deck   []*card
}
