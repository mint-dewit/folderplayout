# folderplayout

> A scheduled playout client for CasparCG.

![Folderplayout](https://raw.githubusercontent.com/baltedewit/folderplayout/v3/images/folderplayout.PNG)

Folderplayout is based on hierarchical schedule. You can combine groups, folders, clips and live inputs and use dates, weeks, days and hours to schedule these. When nothing from the schedule is playing, an external input is played. For example an info channel.

Folderplayout can be ran on solely CasparCG using Decklink inputs or using CasparCG for playout and Blackmagic Atem's for switching inputs.

Internally, folderplayout builds on SuperFly's Timeline project and the Timeline State Resolver from NRK's Sofie project.

#### Build Setup

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:9080
yarn run dev

# build electron application for production
yarn run build


# lint all JS/Vue component files in `src/`
yarn run lint

```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[8fae476](https://github.com/SimulatedGREG/electron-vue/tree/8fae4763e9d225d3691b627e83b9e09b56f6c935) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
