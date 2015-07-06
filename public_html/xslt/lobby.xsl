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
    
    <xsl:template match="//lobby">
        <xsl:variable name="numPlayers"><xsl:value-of select="//lobby/numPlayers"/></xsl:variable>
        <xsl:variable name="lobbyname"><xsl:value-of select="//lobby/name"/></xsl:variable>
        
        <div id="lobby" class="contentregion">
            <div id="mainbox">
                <div id="header">Warte auf weitere Spieler...</div>
                <div id="main">
                    <div>
                        <label>Spielname:</label>
                        <span><xsl:value-of select="//lobby/name" /></span>
                        <xsl:choose>
                            <xsl:when test="$session = //lobby/owner/id">
                                <button type="button" class="btn btn-info changevalue" id="open_changename">Ändern</button>
                                <div class="overlay" id="overlay_changename">
                                    <form class="wrapper" id="changename">
                                        <h2>Spielname ändern:</h2>
                                        <input type="input" value="{$lobbyname}" id="lobbyname" />
                                        <button type="submit" class="btn btn-info changevalue">OK</button>
                                    </form>
                                </div>
                            </xsl:when>
                            <xsl:otherwise />
                        </xsl:choose>
                    </div>
                    <div>
                        <label>Maximale Spieler: </label> 
                        <span class="lbl_changenum"><xsl:value-of select="//lobby/numPlayers" /></span>
                        <xsl:choose>
                            <xsl:when test="$session = //lobby/owner/id">
                                <button type="button" class="btn btn-info changevalue" id="open_changenum">Ändern</button>
                                <div class="overlay" id="overlay_changenum">
                                    <form class="wrapper" id="changenum">
                                        <h2>Spieleranzahl ändern:</h2>
                                        <span class="lbl_changenum"><xsl:value-of select="//lobby/numPlayers" /></span>
                                        <input type="range" min="1" max="10" value="{$numPlayers}" step="1" id="numplayers" />
                                        <button type="submit" class="btn btn-info changevalue">OK</button>
                                    </form>
                                </div>
                            </xsl:when>
                            <xsl:otherwise />
                        </xsl:choose>

                    </div>
                    <div>
                        <label>Erstellt von: </label>
                        <xsl:value-of select="//lobby/owner/name" />
                    </div>
                    <div>
                        <label>Kartenset:</label>
                         <xsl:choose>
                            <xsl:when test="$session = //lobby/owner/id">
                                <div id="chooseset">
                                    <xsl:apply-templates select="sets" />
                                </div>
                            </xsl:when>
                            <xsl:otherwise>
                                <span><xsl:value-of select="//lobby/set/title" /> (<xsl:value-of select="//lobby/set/card_count" /> Karten)</span>
                            </xsl:otherwise>
                        </xsl:choose>
                    </div>
                    <div id="players">
                        <xsl:apply-templates select="players" />
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
    
    <xsl:template match="//sets">
        <select id="changeset">
            <xsl:apply-templates />
        </select>
    </xsl:template>

    <xsl:template match="set">
        <xsl:variable name="name" select="@name" />
        <xsl:choose>
            <xsl:when test="$name = //lobby/set/@name">
                <option value="{$name}">
                    <xsl:value-of select="title" /> (<xsl:value-of select="card_count" />)
                </option>
            </xsl:when>
            <xsl:otherwise>
                <option value="{$name}" selected>
                    <xsl:value-of select="title" /> (<xsl:value-of select="card_count" />)
                </option>
            </xsl:otherwise>
        </xsl:choose>    
    </xsl:template>
    
    <xsl:template match="//player">
        <div class="player"><xsl:value-of select="name" /></div>
    </xsl:template>



    <!-- do not output everything -->
    <xsl:template match="text()|@*">
    </xsl:template>

</xsl:stylesheet>
