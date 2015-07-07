package trumpf

import (
	"encoding/xml"
)

type PropertyDef struct {
	XMLName xml.Name `xml:"value"`

	ID   string `xml:"tag"`
	Name string `xml:"name"`
	Unit string `xml:"suffix"`
	Type string `xml:"type"`
}

type PropertyWrapper struct {
	Values []*PropertyDef `xml:"value"`
}

func (this *PropertyDef) IsBiggerBetter() bool {
	return this.Type == "bigger"
}

type Property struct {
	Definition *PropertyDef
	Value      float32
}
