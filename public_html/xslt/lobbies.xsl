<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : lobbies.xsl
    Created on : 17. Juni 2015, 00:24
    Author     : Clemens
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.w3.org/2003/05/soap-envelope" version="1.0">
        
    <xsl:template match="//lobby">
        <xsl:variable name="lobbyid" select="id" />
        <xsl:variable name="setname" select="set" />
        
        <div class="lobby-item" id="{$lobbyid}">
            <div class="lobby_name"><xsl:value-of select="name" /></div>
            <div class="lobby_owner">Spiel von: <xsl:value-of select="owner/name" /></div>
            <div class="lobby_num_players">Spieler: <xsl:value-of select="count(players/player)" />/<xsl:value-of select="numPlayers" /></div>
            <div class="set">Karten: 
                <xsl:value-of select="//sets/set[@name = $setname]/title" /> 
                (<xsl:value-of select="//sets/set[@name = $setname]/card_count" /> Karten)
            </div>
        </div>
    </xsl:template>
    
    <!-- do not output everything -->
    <xsl:template match="text()|@*">
    </xsl:template>

</xsl:stylesheet>
