#!/usr/bin/python
# coding=utf-8

import xml.etree.cElementTree as ET
import xml.dom.minidom as minidom

def factors(n):
    result = 0

    for i in range(1, n + 1):
        if n % i == 0:
            result += 1

    return result

def sum_digits(n):
    sum = 0
    while n:
        sum += n % 10
        n /= 10
    return sum

def sum_bin(n):
	bin = int("{0:b}".format(n))
	return sum_digits(bin)

root = ET.Element("cardset")
definition = ET.SubElement(root, "definition")
ET.SubElement(definition, "no_values").text = "3"
values = ET.SubElement(definition, "values")
value1 = ET.SubElement(values, "value")
ET.SubElement(value1, "tag").text = "teiler"
ET.SubElement(value1, "type").text = "small"
ET.SubElement(value1, "name").text = "Teiler"
ET.SubElement(value1, "suffix").text = ""
value2 = ET.SubElement(values, "value")
ET.SubElement(value2, "tag").text = "quer"
ET.SubElement(value2, "type").text = "big"
ET.SubElement(value2, "name").text = "Quersumme"
ET.SubElement(value2, "suffix").text = ""
value3 = ET.SubElement(values, "value")
ET.SubElement(value3, "tag").text = "quer_bin"
ET.SubElement(value3, "type").text = "big"
ET.SubElement(value3, "name").text = "Quersumme Binaerdarstellung"
ET.SubElement(value3, "suffix").text = ""
cards = ET.SubElement(root, "cards")

for x in range(1, 40):
	y = str(x)
	wcard = ET.SubElement(cards, "card")
	ET.SubElement(wcard, "no").text = y
	ET.SubElement(wcard, "titel").text = y
	link = 'https://userpage.fu-berlin.de/tspickhofen/xmlpics/number' + y + '.jpg'
	ET.SubElement(wcard, "value", id="card_pic").text = link
	ET.SubElement(wcard, "value", id="teiler").text = str(factors(x))
	ET.SubElement(wcard, "value", id="quer").text = str(sum_digits(x))
	ET.SubElement(wcard, "value", id="quer_bin").text = str(sum_bin(x))




xmlstr = minidom.parseString(ET.tostring(root)).toprettyxml(indent="   ")
with open("New_Database.xml", "w") as f:
	f.write(xmlstr.encode('utf-8'))



