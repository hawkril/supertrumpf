package trumpf

type rules struct {
	CardsPerPlayer  int  `xml:"cards-per-player"`
	WinnerGetsCards bool `xml:"winner-gets-cards"`
}
