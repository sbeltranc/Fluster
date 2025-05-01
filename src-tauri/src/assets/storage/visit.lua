-- Fluster
-- file name: visit.lua
-- file description: An little script that makes play-solo work in Studio clients

local RunService = game:GetService("RunService")
local NetworkServer = game:GetService("NetworkServer")

-- handling player added logic
function onPlayerAdded(player)
    -- new player joined, handle characteradded logic    
    player:LoadCharacter(true)

    game.Workspace.CurrentCamera.CameraType = 3
    game.Workspace.CurrentCamera.CameraSubject = player.Character

    while wait() do
        if player.Character then
            -- player character is not nil, check if it's alive
            local humanoid = player.Character.Humanoid

            if humanoid then
                if humanoid.Health == 0 then
                    -- player character is dead, respawn it
                    wait(5)
                    player:LoadCharacter(true)

                    game.Workspace.CurrentCamera.CameraType = 3
                    game.Workspace.CurrentCamera.CameraSubject = player.Character
                end
            else
                -- humanoid is nil, load a new character
                wait(5)
                player:LoadCharacter(true)

                game.Workspace.CurrentCamera.CameraType = 3
                game.Workspace.CurrentCamera.CameraSubject = player.Character
            end
        else
            -- player character is nil, load a new one
            wait(5)
            player:LoadCharacter(true)

            game.Workspace.CurrentCamera.CameraType = 3
            game.Workspace.CurrentCamera.CameraSubject = player.Character
        end
    end
end

game.Players.PlayerAdded:connect(onPlayerAdded)

-- starting the solo server
RunService:Run()

-- creating a new player
local plr = game:GetService("Players"):CreateLocalPlayer(0)

pcall(function() plr:SetAccountAge(0) end)
pcall(function() plr:SetUnder13(false) end)
pcall(function() plr:SetAdminMode(false) end)