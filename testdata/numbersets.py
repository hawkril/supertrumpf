#!/usr/bin/python
# coding=utf-8

import xml.etree.cElementTree as ET
import xml.dom.minidom as minidom
import sys
import rdflib
import codecs
import os.path

setname = 'numbers'
filename = 'numbers.xml'
settitel = 'Zahlen' 
card_no = 40 

#helper functions 
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

#create document root

root = ET.Element('cardset')

#create definition section
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

#create cards
cards = ET.SubElement(root, "cards")

for x in range(1, card_no+1):
	y = str(x)
	wcard = ET.SubElement(cards, "card")
	ET.SubElement(wcard, "no").text = y
	ET.SubElement(wcard, "titel").text = y
	link = 'https://userpage.fu-berlin.de/tspickhofen/xmlpics/number' + y + '.jpg'
	ET.SubElement(wcard, "card_pic").text = link
	ET.SubElement(wcard, "value", id="teiler").text = str(factors(x))
	ET.SubElement(wcard, "value", id="quer").text = str(sum_digits(x))
	ET.SubElement(wcard, "value", id="quer_bin").text = str(sum_bin(x))




xmlstr = minidom.parseString(ET.tostring(root)).toprettyxml(indent="   ")
with open(filename, "w") as f:
	f.write(xmlstr.encode('utf-8'))

if not os.path.isfile('sets.xml'):
    setsdoc = minidom.Document()
    sets = setsdoc.createElement('sets')
    sets.setAttribute('xmlns', '46.4.83.144')
    sets.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
    sets.setAttribute('xsi:schemaLocation', 'sets.xsd')
    setsdoc.appendChild(sets)
else:
    setsdoc = minidom.parse('sets.xml')
    sets = setsdoc.getElementsByTagName("sets")[0]

set = setsdoc.createElement('set')
set.setAttribute('name', setname)
sets.appendChild(set)

stitle = setsdoc.createElement('title')
set.appendChild(stitle)
stitle.appendChild(setsdoc.createTextNode(settitel))
scc = setsdoc.createElement('card_count')
set.appendChild(scc)
scc.appendChild(setsdoc.createTextNode(str(card_no)))
splay = setsdoc.createElement('max_players')
set.appendChild(splay)  
splay.appendChild(setsdoc.createTextNode(str(card_no // 8)))

setsdoc.writexml( open('sets.xml', 'w'),
           indent="  ",
           addindent="  ",
           newl='\n')



#helper functions 
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

