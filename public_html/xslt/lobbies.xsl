<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : lobbies.xsl
    Created on : 17. Juni 2015, 00:24
    Author     : Clemens
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.w3.org/2003/05/soap-envelope" version="1.0">
    
    <xsl:template match="/">
        <div id="mainbox" class="lobbies">
            <div id="header">Wähle ein Spiel aus...</div>
            <div id="main">
                <xsl:apply-templates />
            </div>
            <div id="footer">
                <label for="gamename">Neues Spiel:</label> 
                <input type="text" class="form-control" id="gamename" placeholder="Name deines Spiels" />
                <button type="button" class="btn btn-success" id="newgame">Spiel erstellen</button>
            </div>
        </div>
    </xsl:template>
    
    <xsl:template match="lobby">
        <xsl:variable name="lobbyid"><xsl:value-of select="id"/></xsl:variable>
        
        <div class="lobby" id="{$lobbyid}">
            <div class="lobby_name"><xsl:value-of select="name" /></div>
            <div class="lobby_owner">Spiel von: <xsl:value-of select="owner/name" /></div>
            <div class="lobby_num_players">Max. Spieler: <xsl:value-of select="numPlayers" /></div>
            <div class="set">Kartenset: Zahlen (32 Karten)</div>
        </div>
    </xsl:template>
    
    <!-- do not output everything -->
    <xsl:template match="text()|@*">
    </xsl:template>

</xsl:stylesheet>
