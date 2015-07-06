package trumpf

import (
	"trumpf-core/events"
	"trumpf-core/lobbies"
	"trumpf-core/players"
	"trumpf-core/utils"

	"math"
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
	Set        *Set      `xml:"set"`
}

type move struct {
	PlayerID string        `xml:"player_id"`
	Property int           `xml:"property"`
	Cards    []*playerCard `xml:"cards>card"`
}

type playerCard struct {
	Card
	PlayerID string `xml:"player_id,attr"`
}

// ShufflePlayers shuffles the order of players in the session
func (this *session) ShufflePlayers() {
	var a, b int
	for range this.Players {
		a = utils.RandomInt(0, len(this.Players)-1)
		b = utils.RandomInt(0, len(this.Players)-1)
		if a == b {
			continue
		}

		this.Players[a], this.Players[b] = this.Players[b], this.Players[a]
	}
}

// StartGame takes a lobby and converts it into a game session
func StartGame(lobby *lobbies.Lobby) (*session, error) {
	set, err := QuerySet(lobby.Set)
	if err != nil {
		return nil, err
	}

	ps := make([]*Player, lobby.Players.Len())
	i := 0
	for p := lobby.Players.Front(); p != nil; p = p.Next() {
		ps[i] = &Player{Player: p.Value.(*players.Player)}
		ps[i].Deck = NewDeck([]int{}, set)
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

	cards := utils.RandomShuffle(set.CardCount)

	for len(cards) >= len(s.Players) {
		for i, p := range s.Players {
			// ToDo: Error handling
			card, err := QueryCard(lobby.Set, cards[i])
			if err != nil {
				return nil, err
			}
			p.Deck.AddBack(card)
		}
		cards = cards[len(s.Players)-1:]
	}

	return s, nil
}

func addSession(sess *session) bool {
	if _, ok := l[sess.ID]; ok {
		return false
	}
	l[sess.ID] = sess
	return true
}

func (this *session) SendEvent(ev *events.Event) {
	for _, p := range this.Players {
		player := p.Player
		player.RLock()
		// Non-blocking channel write
		ch := player.GetChannel("game_" + this.ID)
		select {
		case ch <- ev:
		default:
		}
		player.RUnlock()
	}
}

func (this *session) MakeMove(playerID string, property int) bool {
	this.Lock()
	defer this.Unlock()

	// Is the player the next one to play?
	if this.Players[this.NextPlayer].Player.ID != playerID {
		return false
	}

	// Is the property available?
	if len(this.Set.Properties) <= property {
		return false
	}

	cards := this.PlayerCards()
	// Send out an move event
	this.SendEvent(events.New("game_move", playerID, move{
		PlayerID: playerID,
		Property: property,
		Cards:    cards,
	}))

	// The move is valid. Do the math
	bigger := this.Set.Properties[property].IsBiggerBetter()
	currentValue := float64(0)
	currentPlayer := -1
	tie := false
	if bigger {
		currentValue = math.Inf(1)
	} else {
		currentValue = math.Inf(-1)
	}
	for i, p := range this.Players {
		card, err := p.Deck.GetCurrent()
		if err != nil {
			this.SendEvent(events.New("internal_error", "system", nil))
			continue
		}
		playerVal := card.Values[property].FloatContent()
		if playerVal == currentValue {
			tie = true
		} else if playerVal > currentValue {
			currentValue = playerVal
			currentPlayer = i
			tie = false
		}
	}
	if tie {
		events.New("tie", playerID, nil)
		// ToDo
	} else {
		for i, p := range this.Players {
			if i == currentPlayer || p.Lost() {
				continue
			}
			card, err := p.Deck.RemoveFront()
			if err != nil {
				continue
			}
			this.Players[currentPlayer].Deck.AddBack(card)
			if p.Lost() {
				this.SendEvent(events.New("game_loose", playerID, p.Player))
			}
		}
		if w := this.HasWinner(); w != nil {
			this.SendEvent(events.New("game_win", playerID, w.Player))
		}
	}
	return true
}

func (this *session) HasWinner() (pl *Player) {
	for _, p := range this.Players {
		if p != nil {
			if pl != nil {
				return nil
			}
			pl = p
		}
	}
	return
}

func (this *session) PlayerCards() []*playerCard {
	playerCards := make([]*playerCard, 0)
	for _, p := range this.Players {
		if !p.Lost() {
			card, err := p.Deck.GetCurrent()
			if err != nil {
				continue
			}
			playerCards = append(playerCards, &playerCard{
				PlayerID: p.Player.ID,
				Card:     *card,
			})
		}
	}
	return playerCards
}

func GetSession(sessionID string) *session {
	m.RLock()
	defer m.RUnlock()

	return l[sessionID]
}

func (this *session) getPlayer(playerID string) *Player {
	for _, p := range this.Players {
		if p.Player.ID == playerID {
			return p
		}
	}
	return nil
}

func (this *session) GetOwnCard(playerID string) *Card {
	this.RLock()
	defer this.RUnlock()
	p := this.getPlayer(playerID)
	if p == nil {
		return nil
	}
	card, err := p.Deck.GetCurrent()
	if err != nil || card == nil {
		return nil
	}
	return card
}

func (this *session) HasPlayer(playerID string) bool {
	return this.getPlayer(playerID) != nil
}
