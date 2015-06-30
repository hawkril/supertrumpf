<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : lobby.xsl
    Created on : 15. Juni 2015, 05:06
    Author     : Clemens
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:param name="session" />
    
    <xsl:template match="/">
        <xsl:variable name="numPlayers"><xsl:value-of select="//lobby/numPlayers"/></xsl:variable>
        <xsl:variable name="lobbyname"><xsl:value-of select="//lobby/name"/></xsl:variable>
        
        <div id="lobby" class="contentregion">
            <div id="mainbox">
                <div id="header">Warte auf weitere Spieler...</div>
                <div id="main">
                    <xsl:if test="$session = //lobby/owner/id">
                    <div><label>Spielname:</label>
                    <span><xsl:value-of select="//lobby/name" /></span>
                    <!--<input type="text" class="form-control" id="gamename" placeholder="{$lobbyname}" />--><button type="button" class="btn btn-default" id="changename">Ändern</button></div>
                    </xsl:if>
                    <div>
                        <label>Maximale Spieler: </label> 
                        <span id="lblnumplayers"><xsl:value-of select="//lobby/numPlayers" /></span>

                        <!--
                        <xsl:if test="$session = //lobby/owner/id">
                            <input type="range" min="0" max="10" value="{$numPlayers}" step="1" id="numplayers" />
                        </xsl:if>-->
                    </div>
                    <div><label>Erstellt von: </label><xsl:value-of select="//lobby/owner/name" /></div>
                    <div><label>Kartenset:</label></div>
                    <div id="players">
                        <xsl:apply-templates />
                    </div>
                </div>
                <div id="footer">
                    <button type="button" class="btn btn-warning" id="leavegame">Spiel verlassen</button>
                    <xsl:if test="$session = //lobby/owner/id">
                        <button type="button" class="btn btn-success" id="startgame">Spiel starten</button>
                    </xsl:if>
                </div>
            </div>
        </div>
    </xsl:template>

    <xsl:template match="//player">
        <div class="player"><xsl:value-of select="name" /></div>
    </xsl:template>

    <!-- do not output everything -->
    <xsl:template match="text()|@*">
    </xsl:template>

</xsl:stylesheet>
