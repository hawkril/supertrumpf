#!/usr/bin/python
# coding=utf-8


import xml.dom.minidom as minidom
import sys
import requests
import json
from SPARQLWrapper import SPARQLWrapper, JSON
import rdflib
import simplejson
import codecs
import os.path


wikidata_query= 'http://wdq.wmflabs.org/api?q=(claim[31:6256]%20AND%20claim[31:3624078]%20AND%20link[dewiki])'
sparql_query_1 = """select ?name ?pop ?area ?water ?gdp ?flag ?Concept where {  ?Concept  owl:sameAs <http://wikidata.dbpedia.org/resource/Q"""
sparql_query_2 = """> . ?Concept rdfs:label ?name . ?Concept dbpedia-owl:populationTotal ?pop . ?Concept dbpprop:areaKm ?area . ?Concept dbpprop:gdpNominalPerCapita ?gdp . ?Concept foaf:depiction ?flag . ?Concept dbpedia-owl:percentageOfAreaWater ?water . FILTER (langMatches(lang(?name),"de"))} LIMIT 1"""
setname = 'countries'
filename = 'countries.xml'
settitle = 'Länder'
cardcount = 0
no_values = 4
valueinfo = ['pop','big','Einwohnerzahl','','area','big','Fläche','km²','water','small','Wassrfläche','%','gdp','big','Bruttoinlandsprodukt','$ pro Kopf']
doc = minidom.Document()
cardset = doc.createElement('cardset')
doc.appendChild(cardset)

	
def createset():
	definition = doc.createElement('definition')
	cardset.appendChild(definition)
	values = doc.createElement('values')
	cardset.appendChild(values)
	for x in xrange(0,no_values):
		value  = doc.createElement('value')
		values.appendChild(value)
		value.appendChild(doc.createElement('tag'))
		value.childNodes[0].appendChild(doc.createTextNode(valueinfo[4*x]))
		value.appendChild(doc.createElement('type'))
		value.childNodes[1].appendChild(doc.createTextNode(valueinfo[(4*x)+1]))
		value.appendChild(doc.createElement('name'))
		value.childNodes[2].appendChild(doc.createTextNode(valueinfo[(4*x)+2]))
		value.appendChild(doc.createElement('suffix'))
		value.childNodes[3].appendChild(doc.createTextNode(valueinfo[(4*x)+3]))
	#create cards
	cards = doc.createElement('cards')
	cardset.appendChild(cards)
	return cards
	
def addcard(elem):
	data = elem.getElementsByTagName("binding")
	if data.length > 0:
		wcard = doc.createElement('card')
		cards.appendChild(wcard)
		wno = doc.createElement('no')
		wcard.appendChild(wno)
		wno.appendChild(doc.createTextNode(str(cardcount+1).encode('utf-8')))
		wtitel = doc.createElement('titel')
		wcard.appendChild(wtitel)
		wpic = doc.createElement('card_pic')
		wcard.appendChild(wpic)
		for x in xrange(0,no_values):
			value = doc.createElement('value')
			wcard.appendChild(value)
			value.setAttribute('name', valueinfo[4*x])
		for date in data:
			text = doc.createTextNode(date.childNodes[0].childNodes[0].data.encode('utf-8')) 
			if date.attributes['name'].value == 'name':
				wtitel.appendChild(text)
			elif date.attributes['name'].value == 'flag':
				wpic.appendChild(text)
			elif date.attributes['name'].value == 'pop':
				wcard.childNodes[3].appendChild(text)
			elif date.attributes['name'].value == 'area':
				wcard.childNodes[4].appendChild(text)
			elif date.attributes['name'].value == 'water':
				wcard.childNodes[5].appendChild(text)
			elif date.attributes['name'].value == 'gdp':
				wcard.childNodes[6].appendChild(text)
		return True
	else:
		return False


def	addset():
	if not os.path.isfile('sets.xml'):
		setsdoc = minidom.Document()
		sets = doc.createElement('cardset')
		setsdoc.appendChild(sets)
	else:
		setsdoc = minidom.parse('sets.xml')
		sets = elem.getElementsByTagName("sets")[0]

	set = setsdoc.createElement('set')
	set.setAttribute('name', setname)
	sets.appendChild(set)

	stitle = setsdoc.createElement('title')
	set.appendChild(stitle)
	stitle.appendChild(setsdoc.createTextNode(settitle))
	scc = setsdoc.createElement('card_count')
	set.appendChild(scc)
	scc.appendChild(setsdoc.createTextNode(str(cardcount)))
	splay = setsdoc.createElement('max_players')
	set.appendChild(splay)	
	splay.appendChild(setsdoc.createTextNode(str(cardcount // 8)))

	setsdoc.writexml( open('sets.xml', 'w'),
               indent="  ",
               addindent="  ",
               newl='\n')

##########################################################

cards = createset()
r = requests.get(wikidata_query)
data = json.loads(r.text)
sparql = SPARQLWrapper("http://dbpedia.org/sparql")
for x in data['items']:
	sparql.setQuery(sparql_query_1 + str(x) + sparql_query_2)
	sparql.setReturnFormat('xml')
	result = sparql.query().convert()
	# print 'adding'
	# print result.toxml()
	if addcard(result):
		cardcount += 1
addset()

doc.writexml( open(filename, 'w'),
               indent="  ",
               addindent="  ",
               newl='\n')




