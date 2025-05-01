-- Fluster
-- file name: gameserver.lua
-- file description: An script that allows studio instances to run as a server and allow connection from other LAN clients

local port = 53640
local sleepTime = 10

local ns = game:service("NetworkServer")

game:service("Players").PlayerAdded:connect(function(player)
    player:LoadCharacter(true)

	while wait() do
        if player.Character then
            local humanoid = player.Character.Humanoid

            if humanoid then
                if humanoid.Health == 0 then
                    wait(5)
                    player:LoadCharacter(true)
                end
            else
                wait(5)
                player:LoadCharacter(true)
            end
        else
            wait(5)
            player:LoadCharacter(true)
        end
    end
end)

pcall(function() game:GetService("NetworkServer"):SetIsPlayerAuthenticationRequired(false) end)

if port > 0 then
	ns:start(port, sleepTime) 
end

game:service("RunService"):run()