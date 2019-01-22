# WP2018_C
Repository for WP2018 team C

# Usage
1. `npm install` to install the dependancies
2. launch server in production mode using `npm start`, set the PORT environment variable to change the port(default __11070__)
3. browse __localhost:11070/muzikuro__ to see the game.

# Files and Folders
### assets/
Images and static files to be used in the game.
### js/
client and server side javascript
### public/
html and css, including the about us page and the game page.

# Socket connection protocol
## Client to Server Events
#### requestPlayer
    when new client connected, the server will receive "requestPlayer" and will be responsible for creating new player and sending the informations back to the client.
#### playerMove
    when a player moves, the movement will be sent to the server and broadcasted to all other players.
## Server to Client Events
#### "connect"
    when the client connected to the server successfully, it will emit the "requestPlayer" event to the server.
#### "disconnect"
    when disconnected, all players will be destroyed (the players list and the sprites)
#### "createLocalPlayer"
    when the server decided your role and partner, you will recieve this event to create the local player.
#### "newPlayer"
    when a new player joined or there are existing player when the client connected, the player information send to the client to create a local "RemotePlayer".
#### "playerMove"
    the broadcasted player movement to be updated to the local "RemotePlayer"
#### "destroyPlayer"
    when a player disconnected, this event will be send and the client side "RemotePlayer" is destroyed.
#### "updatePartner"
    if someone's partner changed, this event will be broadcasted to every player to update the partner_id( data[1] ) of the player( data[0] ).