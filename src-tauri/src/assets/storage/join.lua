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
		marker = replicator:SendMarker()
	end)

	if not success then
		showErrorMessage(err)
	end

	if not marker then
		showErrorMessage("Failed to connect to the server.")
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

	player = game:GetService("Players"):CreateLocalPlayer({{user_id}})
	client:connect("{{server_ip}}", {{server_port}}, 0)
end)

if not success_connect then
	showErrorMessage(error_connect)
end