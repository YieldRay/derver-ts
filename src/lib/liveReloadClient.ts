//@ts-nocheck
import { Options } from './types'

/**
 * Must be a clean function.
 * Will be injected in browser client in <script> tag.
 */
export function lrClient(options: Options) {
    return function (URL, scrollTimeout) {
        let timer

        function liveReload() {
            if (!!window.EventSource) {
                var source = new EventSource(URL)

                function getData(e) {
                    return JSON.parse(e.data)
                }

                source.addEventListener(
                    'refresh',
                    function (e) {
                        window.location.reload(true)
                    },
                    false,
                )

                source.addEventListener(
                    'console',
                    function (e) {
                        console.log(getData(e).text)
                    },
                    false,
                )

                source.addEventListener(
                    'srverror',
                    function (e) {
                        let data = getData(e)
                        showModal(data.header, data.text)
                    },
                    false,
                )

                source.addEventListener(
                    'open',
                    function (e) {
                        if (timer) location.reload()
                        console.log('[LiveReload] Ready')
                    },
                    false,
                )

                source.addEventListener(
                    'error',
                    function (e) {
                        if (e.eventPhase == EventSource.CLOSED) source.close()

                        if (e.target.readyState == EventSource.CLOSED) {
                            console.log(
                                '[LiveReload] Disconnected! Retry in 5s...',
                            )
                            !timer &&
                                showModal(
                                    'Disconnected!',
                                    'Connection with server was lost.',
                                )
                            timer = setTimeout(liveReload, 5000)
                        } else if (
                            e.target.readyState == EventSource.CONNECTING
                        ) {
                            console.log('[LiveReload] Connecting...')
                        }
                    },
                    false,
                )
            } else {
                console.error(
                    "[LiveReload] Can't start LiveReload! Your browser doesn't support SSE",
                )
            }
        }

        function showModal(header, text) {
            const message = document.createElement('div')
            message.innerHTML = `
                  <div class="lrmsg-bg">
                    <div class="lrmsg-modal">
                      <div class="lrmsg-close" onclick="this.parentNode.parentNode.remove()">×</div>
                      <div class="lrmsg-header">${header}</div>
                      <div class="lrmsg-content">${text}</div>
                    </div>
                  </div>
                  <style>
                    .lrmsg-bg{
                      font-family: Verdana, Geneva, sans-serif;
                      font-size: 16px;
                      background: rgba(30, 30, 30, 0.6);
                      position: fixed;
                      top: 0;
                      right: 0;
                      bottom: 0;
                      left: 0;
                      z-index: 1;
                    }

                    .lrmsg-modal{
                      position: relative;
                      max-width: 600px;
                      max-height: 400px;
                      margin: 40px auto; 
                      margin-top: 0px;
                      background-color: #1e1e1e;
                      border-top: 3px solid red;
                      border-radius: 5px;
                      opacity: 0;
                      animation: slide 0.3s forwards;
                      color: #cccccc;
                    }

                    .lrmsg-header{
                      font-weight: bold;
                      font-size: 18px;
                      padding: 10px;
                    }

                    .lrmsg-close{
                      float: right;
                      font-weight: bold;
                      color: #cccccc;
                      font-size: 25px;
                      margin: 3px 10px;
                      cursor: pointer;
                    }

                    .lrmsg-close:hover{color:#9a9a9a}

                    .lrmsg-content{
                      padding: 10px;
                      border-top: 1px solid #363636;
                    }

                    @keyframes slide {
                      100% { margin-top: 40px; opacity: 1;}
                  }
                  </style>
                  `

            document.body.append(message)
        }

        function preserveScroll() {
            const x = Number.parseInt(sessionStorage.getItem('_ds_x') || '0')
            const y = Number.parseInt(sessionStorage.getItem('_ds_y') || '0')
            setTimeout(() => window.scrollTo(x, y), scrollTimeout)

            window.addEventListener('scroll', () => {
                sessionStorage.setItem('_ds_x', window.scrollX)
                sessionStorage.setItem('_ds_y', window.scrollY)
            })
        }

        liveReload()
        scrollTimeout && preserveScroll()
    }.toString()
}
