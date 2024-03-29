package main

import (
	"encoding/xml"
	"html"
	"log"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/go-martini/martini"
	"github.com/martini-contrib/cors"
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

func main() {
	// Read the port from the parameters
	port := ":80"
	if len(os.Args) < 2 {
		log.Println("No port specified, assuming 80")
	} else {
		port = os.Args[1]
	}

	// Connect to the database
	err := database.Connect("localhost:1984", "xml", "trumpf2015")
	if err != nil {
		log.Fatalln(err)
	}

	// Initialize Martini
	m := martini.Classic()
	m.Use(render.Renderer(render.Options{IndentXML: true, PrefixXML: []byte(xml.Header)}))

	// only for development reason enable Access Control Allow Origin Header
	m.Use(cors.Allow(&cors.Options{
		AllowAllOrigins: true,
	}))

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

	m.Get("/api/:session/lobby/:lobby", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]

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

		lobby.RLock()
		r.XML(http.StatusOK, lobby)
		lobby.RUnlock()
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
		r.XML(http.StatusOK, events.New("lobby_joined", "system", lobby))
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

		if lobby.Owner.ID == player.ID {
			if game, err := trumpf.StartGame(lobby); err != nil {
				r.XML(http.StatusBadRequest, events.New("lobby_not_started", "system", err))
			} else {
				lobby.SendEvent(events.New("lobby_started", player.ID, game.ID))
				r.XML(http.StatusOK, events.New("game_started", "system", game.ID))
			}
		}
	})

	m.Get("/api/:session/game/:game/events", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		gameID := p["game"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		game := trumpf.GetSession(gameID)
		if game == nil {
			r.XML(http.StatusNotFound, events.New("game_not_found", "system", nil))
			return
		}

		if !game.HasPlayer(sessionID) {
			r.XML(http.StatusUnauthorized, events.New("game_not_joined", "system", nil))
			return
		}

		player.RLock()
		ch := player.GetChannel("game_" + game.ID)
		player.RUnlock()

		t := time.NewTimer(5 * time.Minute)
		select {
		case ev := <-ch:
			r.XML(http.StatusOK, ev)
			t.Stop()
		case <-t.C:
			r.XML(http.StatusRequestTimeout, events.New("game_event", "system", "No new events in 5 minutes."))
		}
	})

	m.Get("/api/:session/game/:game/move/:prop", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		gameID := p["game"]
		rawProperty := p["prop"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		game := trumpf.GetSession(gameID)
		if game == nil {
			r.XML(http.StatusNotFound, events.New("game_not_found", "system", nil))
			return
		}

		if !game.HasPlayer(sessionID) {
			r.XML(http.StatusUnauthorized, events.New("game_not_joined", "system", nil))
			return
		}

		property64, err := strconv.ParseInt(rawProperty, 10, 64)
		propertyInt := int(property64)
		if err != nil || propertyInt < 0 {
			r.XML(http.StatusBadRequest, events.New("num_invalid", "system", "The property number is not a valid number."))
			return
		}

		if game.MakeMove(player.ID, propertyInt) {
			r.XML(http.StatusBadRequest, events.New("game_move_complete", "system", nil))
		} else {
			r.XML(http.StatusBadRequest, events.New("game_invalid_move", "system", "You are not allowed to make this move."))
		}
	})

	m.Get("/api/:session/game/:game/card", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		gameID := p["game"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusUnauthorized, events.New("login_required", "system", nil))
			return
		}

		game := trumpf.GetSession(gameID)
		if game == nil {
			r.XML(http.StatusNotFound, events.New("game_not_found", "system", nil))
			return
		}

		if !game.HasPlayer(sessionID) {
			r.XML(http.StatusUnauthorized, events.New("game_not_joined", "system", nil))
			return
		}

		card := game.GetOwnCard(player.ID)
		if card != nil {
			r.XML(http.StatusOK, events.New("game_own_card", "system", card))
		} else {
			r.XML(http.StatusNotFound, events.New("game_card_not_found", "system", nil))
		}
	})

	// Query all sets
	m.Get("/api/sets", func(p martini.Params, r render.Render) {
		sets, err := trumpf.QueryAllSets()
		if err != nil {
			r.XML(http.StatusNotFound, events.New("sets_not_found", "system", err.Error()))
		} else {
			r.XML(http.StatusOK, events.New("sets_set", "database", sets))
		}
	})

	// Query single set
	m.Get("/api/set/:set", func(p martini.Params, r render.Render) {
		set, err := trumpf.QuerySet(p["set"])
		if err != nil {
			r.XML(http.StatusNotFound, events.New("card_set_not_found", "system", err.Error()))
		} else {
			r.XML(http.StatusOK, events.New("card_set", "database", set))
		}
	})

	// Query single card
	m.Get("/api/card/:set/:card", func(p martini.Params, r render.Render) {
		setID := p["set"]
		cardString := p["card"]

		cardInt64, err := strconv.ParseInt(cardString, 10, 64)
		if err != nil {
			r.XML(http.StatusBadRequest, events.New("card_number_invalid", "system", err.Error()))
			return
		}

		card, err := trumpf.QueryCard(setID, int(cardInt64))
		if err != nil {
			r.XML(http.StatusNotFound, events.New("card_not_found", "system", err.Error()))
		} else {
			r.XML(http.StatusOK, events.New("card_set", "database", card))
		}
	})

	// Start Martini
	m.RunOnAddr(port)
}
