-- Fluster
-- file name: gameserver.lua
-- file description: An script that allows studio instances to run as a server and allow connection from other LAN clients

local port = 53640
local sleepTime = 10

local ns = game:service("NetworkServer")

function waitForChild(parent, childName)
	while true do
		local child = parent:findFirstChild(childName)
		if child then
			return child
		end
		parent.ChildAdded:wait()
	end
end

function characterRessurection(player)
	if player.Character then
		local humanoid = player.Character.Humanoid
		humanoid.Died:connect(function() wait(5) player:LoadCharacter() end)
    else
        player:LoadCharacter()
	end
end

game:service("Players").PlayerAdded:connect(function(player)
	characterRessurection(player)

	player.Changed:connect(function(name)
		if name=="Character" then
			characterRessurection(player)
		end
	end)
end)

pcall(function() game:GetService("NetworkServer"):SetIsPlayerAuthenticationRequired(false) end)

if port > 0 then
	ns:start(port, sleepTime) 
end

game:service("RunService"):run()