package trumpf

import (
	"trumpf-core/players"
	"trumpf-core/utils"

	"sync"
)

type session struct {
	sync.RWMutex

	Players    []*players.Player
	NextPlayer int
}

func NewSession(ps []*players.Player) *session {
	s := &session{
		Players: ps,
	}
	s.ShufflePlayers()
	return s
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
