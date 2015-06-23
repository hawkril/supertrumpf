package trumpf

type PropertyDef struct {
	ID             int
	Name           string
	Unit           string
	IsBiggerBetter bool
}

type Property struct {
	Definition *PropertyDef
	Value      float32
}
