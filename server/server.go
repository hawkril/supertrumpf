package main

import (
	"encoding/xml"
	"html"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-martini/martini"
	"github.com/martini-contrib/render"

	"trumpf-core/database"
	"trumpf-core/events"
	"trumpf-core/lobbies"
	"trumpf-core/players"
	"trumpf-core/trumpf"
)

const (
	LOBBY_INITIAL_PLAYERS = 4
)

type errorPayload struct {
	Message  string `xml:"message"`
	Redirect string `xml:"redirect,omitempty"`
}

func main() {
	port := ":80"
	if len(os.Args) < 2 {
		log.Println("No port specified, assuming 80")
	} else {
		port = os.Args[1]
	}

	err := database.Connect("localhost:1984", "xml", "trumpf2015")
	if err != nil {
		log.Fatalln(err)
	}

	m := martini.Classic()
	m.Use(render.Renderer(render.Options{IndentXML: true, PrefixXML: []byte(xml.Header)}))

	// Login handler
	m.Get("/api/login/:user", func(p martini.Params, r render.Render) {
		userName := p["user"]
		userName = strings.TrimSpace(userName)
		userName = html.EscapeString(userName)

		player := players.NewPlayer(userName)
		player.Lock()
		r.XML(http.StatusOK, events.New("login", "system", player))
		player.Unlock()
	})

	// Lobbies handler
	m.Get("/api/:session/lobbies", func(p martini.Params, r render.Render) {
		sessionID := p["session"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		r.XML(http.StatusOK, events.New("lobbies", "system", lobbies.GetLobbies()))
	})

	// Create new lobby
	m.Get("/api/:session/lobbies/new/:name", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		name := p["name"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		// Parse the name
		name, err := url.QueryUnescape(name)
		if err != nil {
			r.XML(http.StatusBadRequest, events.New("name_invalid", "system", err.Error()))
		}
		name = strings.TrimSpace(name)
		if name == "" {
			r.XML(http.StatusBadRequest, events.New("name_invalid", "system", "The desired lobby name is empty or consists of whitespaces."))
			return
		}
		name = html.EscapeString(name)

		r.XML(http.StatusOK, events.New("lobby_created", "system", lobbies.NewLobby(player, name, LOBBY_INITIAL_PLAYERS)))
	})

	// Change lobby name
	m.Get("/api/:session/lobby/:lobby/change_name/:name", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]
		name := p["name"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", "You need to login before accessing the API."))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, events.New("lobby_not_found", "system", "The requested lobby does not exist on the server."))
			return
		}

		// Parse the name
		name, err := url.QueryUnescape(name)
		if err != nil {
			r.XML(http.StatusBadRequest, events.New("name_invalid", "system", err.Error()))
		}
		name = strings.TrimSpace(name)
		if name == "" {
			r.XML(http.StatusBadRequest, events.New("name_invalid", "system", "The desired lobby name is empty or consists of whitespaces."))
			return
		}
		name = html.EscapeString(name)

		lobby.Lock()
		if !lobby.SetName(player, name) {
			lobby.Unlock()
			r.XML(http.StatusUnauthorized, events.New("not_owner", "system", "Only the owner of the lobby can change the lobby name."))
			return
		}
		lobby.Unlock()

		r.XML(http.StatusOK, events.New("lobby_name_changed", "system", name))
	})

	// Change lobby set
	m.Get("/api/:session/lobby/:lobby/change_set/:set", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]
		set := p["set"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, events.New("lobby_not_found", "system", "The requested lobby does not exist on the server."))
			return
		}

		set, err := url.QueryUnescape(set)
		if err != nil {
			r.XML(http.StatusBadRequest, events.New("set_invalid", "system", err.Error()))
		}
		set = strings.TrimSpace(set)
		if set == "" {
			r.XML(http.StatusBadRequest, events.New("set_invalid", "system", "The desired set ID is empty or consists of whitespaces."))
			return
		}
		set = html.EscapeString(set)

		lobby.Lock()
		if !lobby.SetSet(player, set) {
			lobby.Unlock()
			r.XML(http.StatusUnauthorized, events.New("not_owner", "system", "Only the owner of the lobby can change the used set."))
			return
		}
		lobby.Unlock()

		r.XML(http.StatusOK, events.New("lobby_set_changed", "system", set))
	})

	// Change num players
	m.Get("/api/:session/lobby/:lobby/change_num/:num", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]
		num := p["num"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, events.New("lobby_not_found", "system", "The requested lobby does not exist on the server."))
			return
		}

		numPlayers, err := strconv.ParseInt(num, 10, 32)
		numPlayersInt := int(numPlayers)
		if err != nil || numPlayersInt <= 0 {
			r.XML(http.StatusBadRequest, events.New("num_invalid", "system", "The desired player number is not a valid number."))
			return
		}

		lobby.Lock()
		if !lobby.SetNumPlayers(player, numPlayersInt) {
			lobby.Unlock()
			r.XML(http.StatusUnauthorized, events.New("not_owner", "system", "Only the owner of the lobby can change the used set."))
			return
		}
		lobby.Unlock()

		r.XML(http.StatusOK, events.New("lobby_num_players_changed", "system", numPlayersInt))
	})

	// Join lobby
	m.Get("/api/:session/lobby/:lobby/join", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, events.New("lobby_not_found", "system", "The requested lobby does not exist on the server."))
			return
		}

		lobby.Lock()
		if lobby.Full() {
			lobby.Unlock()
			r.XML(http.StatusConflict, events.New("lobby_full", "system", "The lobby you are trying to join is already full."))
			return
		}

		lobby.Join(player)
		lobby.Unlock()
		r.XML(http.StatusOK, events.New("lobby_joined", "system", lobbyID))
	})

	// Leave lobby
	m.Get("/api/:session/lobby/:lobby/leave", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, events.New("lobby_not_found", "system", "The requested lobby does not exist on the server."))
			return
		}

		lobby.Lock()
		lobby.Leave(player)
		lobby.Unlock()

		r.XML(http.StatusOK, events.New("lobby_left", "system", lobbyID))
	})

	// Lobby events
	m.Get("/api/:session/lobby/:lobby/events", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, events.New("lobby_not_found", "system", "The requested lobby does not exist on the server."))
			return
		}

		lobby.RLock()
		if lobby.HasPlayer(player) == nil {
			lobby.RUnlock()
			r.XML(http.StatusBadRequest, events.New("lobby_not_joined", "system", "You need to join the lobby before you can receive events for it."))
			return
		}
		lobby.RUnlock()

		player.RLock()
		ch := player.GetChannel("lobby_" + lobby.ID)
		player.RUnlock()

		t := time.NewTimer(5 * time.Minute)
		select {
		case ev := <-ch:
			r.XML(http.StatusOK, ev)
			t.Stop()
		case <-t.C:
			r.XML(http.StatusRequestTimeout, events.New("lobby_event", "system", "No new events in 5 minutes."))
		}
	})

	// Lobby start
	m.Get("/api/:session/lobby/:lobby/start", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, events.New("lobby_not_found", "system", "The requested lobby does not exist on the server."))
			return
		}

		lobby.Lock()
		ps := make([]*players.Player, lobby.Players.Len())
		i := 0
		for p := lobby.Players.Front(); p != nil; p = p.Next() {
			ps[i] = p.Value.(*players.Player)
			i++
		}
		if lobby.Owner.ID == player.ID {
			lobby.SendEvent(events.New("lobby_started", player.ID, trumpf.StartGame(lobby).ID))
		}
		lobby.Unlock()
	})

	// Get set
	m.Get("/api/set/:set", func(p martini.Params, r render.Render) {
		set := trumpf.QuerySet(p["set"])
		r.XML(http.StatusOK, events.New("card_set", "database", set))
	})

	m.RunOnAddr(port)
}
