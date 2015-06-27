#!/usr/bin/python
# coding=utf-8

import xml.etree.cElementTree as ET
import xml.dom.minidom as minidom
import sys
import requests
import json
from SPARQLWrapper import SPARQLWrapper, JSON
import rdflib
import simplejson

def prettify(elem):
    """Return a pretty-printed XML string for the Element.
    """
    rough_string = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="\t")

def addcard(elem):
	

setname = 'countries'
filename = 'countries.xml'
wikidata_query= 'http://wdq.wmflabs.org/api?q=(claim[31:6256]%20AND%20claim[31:3624078]%20AND%20link[dewiki])'
sparql_query_1 = """select ?name ?pop ?area ?flag ?Concept where {  ?Concept  owl:sameAs <http://wikidata.dbpedia.org/resource/Q"""
sparql_query_2 = """> . ?Concept rdfs:label ?name . ?Concept dbpedia-owl:populationTotal ?pop . ?Concept dbpprop:areaKm ?area . FILTER (langMatches(lang(?name),"de"))} LIMIT 1"""

r = requests.get(wikidata_query)
data = json.loads(r.text)
sparql = SPARQLWrapper("http://dbpedia.org/sparql")
for x in data['items']:
	sparql.setQuery(sparql_query_1 + str(x) + sparql_query_2)
	sparql.setReturnFormat('xml')
	result = sparql.query().convert()
	resET = ET.fromstring(result.toxml('utf-8'))
	print prettify(resET)
	# print result.toxml()	# for result in results["results"]["bindings"]:
	# 	print(result["name"]["value"])

# for x in data['items']:
# 	print(x)

