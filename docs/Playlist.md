# Playlist

add html to index.html inside `<div id="playlist">` or separate playlists.html file:

``` html
<div class="collection" data-modplist="">
   <article class="song" data-modurl="https://api.modarchive.org/downloads.php?moduleid=34654#CTGOBLIN.S3M" data-modtitle="Skaven/FC Catch that goblin!!" data-modtime="02:40" data-moddate="1995-08-13" data-modsize="471"></article>
   <article class="song" data-modurl="https://api.modarchive.org/downloads.php?moduleid=77339#edelweiss.mod" data-modtitle="Edelweiss" data-modtime="06:46" data-moddate="1994-08-07" data-modsize="192"></article>
   <article class="song" data-modurl="https://api.modarchive.org/downloads.php?moduleid=191789#aryx.s3m" data-modtitle="k.kock - aryx" data-modtime="02:21" data-moddate="1995-03-29" data-modsize="20"></article>
   <article class="song" data-modurl="https://api.modarchive.org/downloads.php?moduleid=82567#pinball_fantasies_party_land.mod" data-modtitle="Olof Gustafsson - Party Land (Pinball Fantasies)" data-modtime="04:29" data-moddate="1992-00-00" data-modsize="206"></article>
</div>
```

to set default song, add:

``` html
   <script type="text/javascript">
      default_modurl = "https://api.modarchive.org/downloads.php?moduleid=34654#CTGOBLIN.S3M";
   </script>
```