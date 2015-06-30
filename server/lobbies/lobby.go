package lobbies

import (
	"container/list"
	"encoding/xml"
	"html"
	"sort"
	"strings"
	"sync"

	"trumpf-core/events"
	"trumpf-core/players"
	"trumpf-core/utils"
)

var (
	m sync.RWMutex
	l map[string]*Lobby          = make(map[string]*Lobby)
	w map[string]*players.Player = make(map[string]*players.Player)
)

type Lobby struct {
	sync.RWMutex

	XMLName      xml.Name        `xml:"lobby"`
	ID           string          `xml:"id"`
	Name         string          `xml:"name"`
	NumPlayers   int             `xml:"numPlayers"`
	Owner        *players.Player `xml:"owner,omitempty"`
	Set          string          `xml:"set"`
	Players      *list.List      `xml:"-"`
	playersSlice []string        `xml:"players>player"`
}

// NewLobby creates a lobby and adds it to the lobby list
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

func (this *Lobby) SetNumPlayers(player *players.Player, number int) bool {
	if player != this.Owner {
		return false
	}
	this.NumPlayers = number
	this.SendEvent(events.New("lobby_num_players_changed", this.Owner.ID, this.NumPlayers))
	if this.Players.Len() > this.NumPlayers {
		this.SendEvent(events.New("overfull", this.Owner.ID, this.NumPlayers))
	}
	return true
}

func (this *Lobby) SetName(player *players.Player, name string) bool {
	if player != this.Owner {
		return false
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return false
	}
	this.Name = html.EscapeString(name)
	this.SendEvent(events.New("lobby_name_changed", this.Owner.ID, this.Name))
	return true
}

func (this *Lobby) SetSet(player *players.Player, set string) bool {
	if player != this.Owner {
		return false
	}
	// ToDo: Check if a set with this id exists
	this.Set = set
	this.SendEvent(events.New("lobby_set_changed", this.Owner.ID, this.Set))
	return true
}

func (this *Lobby) SendEvent(ev *events.Event) {
	for p := this.Players.Front(); p != nil; p = p.Next() {
		player := p.Value.(*players.Player)
		player.RLock()

		// Non-blocking channel write
		ch := player.GetChannel("lobby_" + this.ID)
		select {
		case ch <- ev:
		default:
		}

		player.RUnlock()
	}
}

func (this *Lobby) Full() bool {
	return this.NumPlayers <= this.Players.Len()
}

func (this *Lobby) HasPlayer(player *players.Player) *list.Element {
	for p := this.Players.Front(); p != nil; p = p.Next() {
		if p.Value.(*players.Player).ID == player.ID {
			return p
		}
	}
	return nil
}

func (this *Lobby) Join(player *players.Player) bool {
	if this.HasPlayer(player) == nil && this.Players.Len() < this.NumPlayers {
		this.Players.PushBack(player)
		this.SendEvent(events.New("player_joined", player.ID, nil))
		this.generatePlayerSlice()
		return true
	}
	return false
}

func (this *Lobby) Leave(player *players.Player) {
	// Remove player and send event to the remaining players
	if p := this.HasPlayer(player); p != nil {
		this.Players.Remove(p)
		this.SendEvent(events.New("player_left", player.ID, nil))
		this.generatePlayerSlice()
	}
	// If the player is the owner, close the lobby
	if this.Owner.ID == player.ID {
		this.SendEvent(events.New("lobby_closed", player.ID, nil))
		removeLobby(this.ID)
	}
}

func (this *Lobby) generatePlayerSlice() {
	ps := make([]string, 0, this.Players.Len())
	for item := this.Players.Front(); item != nil; item = item.Next() {
		player := item.Value.(*players.Player)
		player.RLock()
		ps = append(ps, player.Name)
		player.RUnlock()
	}
	this.playersSlice = ps
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

func removeLobby(lobbyID string) {
	m.Lock()
	delete(l, lobbyID)
	m.Unlock()
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

func GetLobby(lobbyID string) *Lobby {
	m.RLock()
	res := getLobby(lobbyID)
	m.RUnlock()
	return res
}

func getLobby(lobbyID string) *Lobby {
	return l[lobbyID]
}
