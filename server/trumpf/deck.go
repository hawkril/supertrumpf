package trumpf

import (
	"errors"
	"sync"
)

var (
	ErrNoMoreCards = errors.New("There are no more cards left in this deck")
)

type Deck struct {
	sync.RWMutex

	cards []int
	set   *Set
}

func NewDeck(cards []int, set *Set) *Deck {
	return &Deck{
		cards: cards,
		set:   set,
	}
}

func (this *Deck) GetCurrent() (card *Card, err error) {
	this.RLock()
	card, err = this.getCurrent()
	this.RUnlock()
	return
}

func (this *Deck) getCurrent() (*Card, error) {
	if len(this.cards) == 0 {
		return nil, ErrNoMoreCards
	}
	card, err := QueryCard(this.set.ID, this.cards[0])
	if err != nil {
		return nil, err
	}

	return card, nil
}

func (this *Deck) Empty() (e bool) {
	this.RLock()
	e = this.empty()
	this.RUnlock()
	return
}

func (this *Deck) empty() bool {
	return this.count() == 0
}

func (this *Deck) Count() (c int) {
	this.RLock()
	c = this.count()
	this.RUnlock()
	return
}

func (this *Deck) count() int {
	return len(this.cards)
}

func (this *Deck) Set() *Set {
	return this.set
}

func (this *Deck) RemoveFront() (card *Card, err error) {
	this.Lock()
	card, err = this.removeFront()
	this.Unlock()
	return
}

func (this *Deck) removeFront() (card *Card, err error) {
	card, err = this.getCurrent()
	if err == ErrNoMoreCards {
		return
	}

	copy(this.cards, this.cards[1:])
	this.cards = this.cards[:len(this.cards)-1]
	return
}

func (this *Deck) AddBack(card *Card) (r bool) {
	this.Lock()
	r = this.addBack(card)
	this.Unlock()
	return
}

func (this *Deck) addBack(card *Card) bool {
	if this.set.ID != card.SetID {
		return false
	}
	this.cards = append(this.cards, card.Number)
	return true
}
