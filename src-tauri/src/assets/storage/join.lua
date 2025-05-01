-- Fluster
-- file name: join.lua
-- file description: allows the connection to an existing server from another client on the same network

local client

local function showErrorMessage(message)
	game:SetMessage(message)
	wait(math.huge)
end

local function connectedTo(url, replicator)
	local marker
	local recieved = false

	local function onRecievedMarker()
		recieved = true
	end

	local success, err = pcall(function()
		game:SetMessageBrickCount()
		marker = replicator:SendMarker()
	end)

	if not success then
		showErrorMessage(err)
	end

	if not marker then
		showErrorMessage("Failed to connect to the server.")
	end

	marker.Recieved:connect(onRecievedMarker)

	while not recieved do
		game.Workspace:ZoomToExtents()
		wait(0.5)
	end

	pcall(function() game:ClearMessage() end)
end

local success, err = pcall(function()
	client = game:service("NetworkClient")
	game:GetService("Visit")
end)

if not success then
	showErrorMessage(err)
end

local success_connect, error_connect = pcall(function()
	game:SetMessage("Connecting to server...")

	client.ConnectionAccepted:connect(connectedTo)
	client.ConnectionRejected:connect(function()
		showErrorMessage("Connection rejected by the server.")
	end)
	client.ConnectionFailed:connect(function(peer, errcode, why)
		showErrorMessage("Connection failed: " .. tostring(errcode) .. " - " .. tostring(why))
	end)

	client:connect("localhost", 53640, 0)
end)

if not success_connect then
	showErrorMessage(error_connect)
end