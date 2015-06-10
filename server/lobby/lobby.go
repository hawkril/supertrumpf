package lobby

import (
	"container/list"
	"sort"
	"sync"

	"trumpf-core/players"
	"trumpf-core/utils"
)

var (
	m sync.RWMutex
	l map[string]*Lobby = make(map[string]*Lobby)
)

type Lobby struct {
	sync.RWMutex

	ID         string          `xml:"id"`
	Name       string          `xml:"name"`
	NumPlayers int             `xml:"numPlayers"`
	Owner      *players.Player `xml:"owner,omitempty"`
	Players    *list.List      `xml:"-"`
}

func NewLobby(owner *players.Player, name string, numPlayers int) *Lobby {
	lobby := &Lobby{
		ID:         utils.GenerateID(32),
		Name:       name,
		NumPlayers: numPlayers,
		Owner:      owner,
		Players:    list.New(),
	}
	for !addLobby(lobby) {
		lobby.ID = utils.GenerateID(32)
	}
	return lobby
}

func AddLobby(lobby *Lobby) bool {
	m.Lock()
	res := addLobby(lobby)
	m.Unlock()
	return res
}

func addLobby(lobby *Lobby) bool {
	if _, ok := l[lobby.ID]; ok {
		return false
	}
	l[lobby.ID] = lobby
	return true
}

func GetLobbies() []*Lobby {
	m.RLock()
	res := getLobbies()
	m.RUnlock()
	return res
}

func getLobbies() []*Lobby {
	keys := make([]string, 0, len(l))
	for k := range l {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	lobbies := make([]*Lobby, len(keys))
	for i, key := range keys {
		lobbies[i] = l[key]
	}
	return lobbies
}
