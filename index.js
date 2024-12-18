const express = require('express');
const got = require("got");
const Discord = require('discord.js');
const roblox = require('noblox.js');
const db = require('./db.js');
const client = new Discord.Client();
const app = express();
const keyChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26'];

class Request {
  constructor(rName, key, discordID, msgChannel) {
    this._username = rName;
    this._key = key;
    this._discordID = discordID;
    this._msgChannel = msgChannel;
  }
}

setInterval(function() {
  got("DIRECT GLITCH URL");
}, 240000);

app.get(`/get-requests`, async (request, response) => {
     let name = request.query.username;
     if(!name) return response.sendStatus(400);
     let pendingRequests = await db.get("prrequests") || [];
     for(var i = 0; i < pendingRequests.length; i++) {
       if(pendingRequests[i]._username === name) {
         return response.send(pendingRequests[i]);
       }
     }
     return response.send('No pending request has been found for this username');
});

app.get(`/verify`, async (request, response) => {
     let name = request.query.username;
     if(!name) return response.sendStatus(400);
     let key = request.query.key;
     if(!key) return response.sendStatus(400);
     if(key !== process.env.key) return response.sendStatus(400);
     let pendingRequests = await db.get("prrequests") || [];
     let index = -1;
     for(var i = 0; i < pendingRequests.length; i++) {
       if(pendingRequests[i]._username === name) {
         index = i;
       }
     }
     let obj
     if(index != -1) {
       obj = pendingRequests[index];
       pendingRequests.splice(index, index + 1);
       await db.set("prrequests", pendingRequests);
     } else {
       return response.sendStatus(400);
     }
     let cID = obj._msgChannel;
     let dID = obj._discordID;
     let channel = client.channels.cache.get(cID);
     if(!channel) return;
     let guild = channel.guild;
     let role = guild.roles.cache.find(role => role.name === process.env.verifiedRole);
     if(!role) return;
     let member = guild.members.cache.get(dID);
     if(!member) return;
     try {
       await member.roles.add(role)
     } catch (err) {
       channel.send(err);
     }
     channel.send(`<@${dID}>`)
     let e = new Discord.MessageEmbed();
     e.setColor('BLUE');
     e.setAuthor(member.user.tag, member.user.displayAvatarURL());
     e.setTitle('Verified');
     e.setDescription('You have successfully verified! Thank you!');
     e.setFooter('Command made by zachariapopcorn#8105, have a nice day');
     channel.send(e);
     response.sendStatus(200);
});

let listener = app.listen(process.env.PORT, () => {
     console.log('Your app is currently listening on port: ' + listener.address().port);
});

client.on("ready", async () => {
     console.log("Logged in the Discord bot account");
});

client.on("message", async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(process.env.prefix)) return;
    const args = message.content.slice(process.env.prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    if(command === 'verify') {
      let username = args[0];
      if(!username) {
        return message.channel.send(`Username wasn't supplied`)
      }
      let id
      try {
        id = await roblox.getIdFromUsername(username);
      } catch {
        return message.channel.send('Invalid username supplied');
      }
      let pendingRequests = await db.get("prrequests") || [];
      for(var i = 0; i < pendingRequests.length; i++) {
        if(pendingRequests[i]._name === username) {
          return message.channel.send('This username has already requested to get verified');
        }
      }
      for(var i = 0; i < pendingRequests.length; i++) {
        if(pendingRequests[i]._discordID === message.author.id) {
          return message.channel.send('You already sent a request to get verified');
        }
      }
      let key = "";
      for(var i = 0; i < 25; i++) {
        let char = keyChars[Math.round(Math.random() * keyChars.length)];
        while(!char) {
          char = keyChars[Math.round(Math.random() * keyChars.length)];
        }
        key += char;
      }
      let embed = new Discord.MessageEmbed();
      embed.setColor('BLUE');
      embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
      embed.setTitle('Game Link');
      embed.setDescription(`You're so close to be verified! Please join [this game](https://roblox.com/games/${process.env.gameID}) and enter the key **${key}** in the textbox in order to complete the verifcation process`);
      embed.setFooter('Command created by zachariapopcorn#8105, have a nice day!');
      message.channel.send(embed);
      let newR = new Request(await roblox.getUsernameFromId(id), key, message.author.id, message.channel.id);
      pendingRequests.push(newR);
      await db.set("prrequests", pendingRequests);
    }
});

client.login(process.env.token);
