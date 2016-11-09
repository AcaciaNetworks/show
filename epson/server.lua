-- http = require("socket.http")
-- print(http.request("http://www.baidu.com"))

--[[
References:
    https://github.com/mirven/underscore.lua/blob/master/lib/underscore.lua
    https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/slice

    http://w3.impa.br/~diego/software/luasocket/installation.html
    http://luaforge.net/projects/luasocket/
    http://files.luaforge.net/releases/luasocket/luasocket
]]--

local server_name = "127.0.0.1"
local VERSION = "20160104"

-- epson file soruce
local dataSource = '/data/log/heart_rate'

-- load namespace
local base = _G
local string = require("string")
local table = require("table")
local os = require("os")
local io = require("io")

function string.split(str, delimiter)
    if str==nil or str=='' or delimiter==nil then
        return nil
    end
    local result = {}
    for match in (str..delimiter):gmatch("(.-)"..delimiter) do
        table.insert(result, match)
    end
    return result
end

function sleep(s)
  local ntime = os.time() + s
  repeat until os.time() > ntime
end


local function http_request(req_raw)
    local s = string.split(tostring(req_raw), " ")
    -- GET / HTTP/1.1
    local result = {}
    result.params = nil
    result.method = s[1]
    result.path = s[2]
    result.protocol = s[3]
    return result
end

local function setheaders(headers)
    local h = "\r\n"
    for i, v in pairs(headers) do
        h = i .. ": " .. v .. "\r\n" .. h
    end
    return "HTTP/1.1 200 OK\r\n" .. h
end

local header = {}
header["Server"] = server_name
header["Content-Type"] = "text/html; charset=utf-8"

----------------------------------------------------

local router = {}

-- index
router["/start"] = function(req, res)
    print('starting epsontest...')
    local killResult = os.execute('killall epsontest')
    print(killResult)
    os.execute('/script/epsontest.sh > /dev/null &')

    -- read index.html
    local indexFile = io.open('index.html')
    local indexHtml = indexFile:read('*all')
    indexFile:close()
    return indexHtml
end

router["/epson"] = function(req, res)
    local dataFile = io.open(dataSource)
    if(dataFile == nil) then return '' end
    local toSend = dataFile:read('*all')
    if (toSend == '') then
    -- todo: dead
    end
    dataFile:close()
    return toSend
end

-- killall epsontest
os.execute('killall epsontest')


local socket = require("socket")
local server = assert(socket.bind("0.0.0.0", 80))

-- find out which port the OS chose for us
local ip, port = server:getsockname()
-- print a message informing what's up
print("running on: " .. port)

-- loop forever waiting for clients
while 1 do
    local res = server:accept()
    -- make sure we don't block waiting for this client's line
    res:settimeout(100)
    -- receive the line
    local req_raw, err = res:receive()
    local req = http_request(req_raw)

    --print(inspect(getmetatable(res)))

    -- if there was no error, send it back to the client
    --if not err then res:send("Test Server: <b>aaa</b>" .. line .. "\n") end
    if not err then
        local err_404_page = 1
        
        for i, v in pairs(router) do
        -- {}
            local p1,p2,p3,p4,p5,p6,p7,p8,p9,p10 = string.match(req.path, i)
            if (p1 ~= nil or req.path == i) then
                req.params = {p1,p2,p3,p4,p5,p6,p7,p8,p9,p10}
                res:send(setheaders(header))
                res:send(router[i](req, res))
                err_404_page = 0
                print("REQUEST: ", params, req.path, i)
                break
            end
        end
        if err_404_page == 1 then
            res:send(req.path .. "\r\n404")
        end
    end
    res:close()
end


