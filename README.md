# Kisetsu


<img src="https://i.imgur.com/4XJ1rH3.png">

Kisetsu is an API designed for anime enthusiasts, allowing them to conveniently save and retrieve information about their favorite anime series. Whether you're an avid anime watcher or a casual viewer.

## Manual Installation

Clone the repo:

```bash
git clone https://github.com/zigamacele/kisetsu.git
cd kisetsu
```

Install the dependencies:

```bash
npm install
```

Set the environment variables:

```bash
cp setup/.env.example .env
# open .env and modify the environment variables
```

## Commands

Running in development:

```bash
npm start
# or
npm run dev
```

Running tests:

```bash
npm run test
# or run separate files with
npm run test -- user.test.ts
```

Running in production:

```bash
# build
npm run build
# start
npm run prod
```

## Environment Variables

The environment variables can be found and modified in the `.env` file.

```bash
##Port
PORT =

#JWT Secret
SECRET =

#URL for Monogo DB
DB_HOST =
```

### API Endpoints

List of available routes:

**Auth routes**:\
`POST api/register` - Register\
`POST api/login` - Login

**Anime routes**:\
`POST api/anime/create` - Create new anime\
`PUT api/anime/update/:id` - Update global anime\
`DELETE api/anime/delete/:id` - Delete global anime

**User routes**:\
`GET api/user/list` - Get users list\
`GET api/user/list/:id` - Get users anime\
`PUT api/user/list/:id` - Update users anime\
`DELETE api/user/list/:id` - Delete users anime\
`GET api/user/schedule` - Get users schedule
