package players

import (
	"sync"
)

var (
	m sync.RWMutex
	p map[string]*Player = make(map[string]*Player)
)

// addPlayer adds a new player to the players map
func AddPlayer(player *Player) bool {
	m.Lock()
	res := addPlayer(player)
	m.Unlock()
	return res
}

func addPlayer(player *Player) bool {
	if _, exists := p[player.ID]; exists {
		m.Unlock()
		return false
	}
	p[player.ID] = player
	return true
}

// removePlayer removes a player from the players map
func RemovePlayer(id string) *Player {
	m.Lock()
	res := removePlayer(id)
	m.Unlock()
	return res
}

func removePlayer(id string) *Player {
	player := p[id]
	delete(p, id)
	return player
}

func GetPlayer(id string) *Player {
	m.RLock()
	res := getPlayer(id)
	m.RUnlock()
	return res
}

func getPlayer(id string) *Player {
	return p[id]
}
