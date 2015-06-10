package trumpf

type propertyDef struct {
	ID             int
	Name           string
	Unit           string
	IsBiggerBetter bool
}

type property struct {
	Definition *propertyDef
	Value      float32
}
