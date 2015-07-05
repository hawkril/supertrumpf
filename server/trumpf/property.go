package trumpf

import (
	"encoding/xml"
)

type PropertyDef struct {
	XMLName xml.Name `xml:"values>value"`

	ID   int    `xml:"tag"`
	Name string `xml:"name"`
	Unit string `xml:"suffix"`
	Type string `xml:"type"`
}

func (this *PropertyDef) IsBiggerBetter() bool {
	return this.Type == "bigger"
}

type Property struct {
	Definition *PropertyDef
	Value      float32
}
