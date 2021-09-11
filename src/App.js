import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import {
  Input,
  message,
  Modal,
  Card,
  Avatar
} from 'antd'
import {
  ExclamationCircleOutlined
} from '@ant-design/icons'
import Processing from './components/Processing'
import Countdown from 'react-countdown';
import './App.css'
import { getTimeProps } from 'antd/lib/date-picker/generatePicker'

const { Search } = Input
const { confirm } = Modal

const showDeleteConfirm = (setToken, setWalletAddress) => {
  confirm({
    title: 'Are you sure delete this token?',
    icon: <ExclamationCircleOutlined />,
    okText: 'Yes',
    okType: 'danger',
    cancelText: 'No',
    onOk() {
      localStorage.removeItem('token')
      localStorage.removeItem('walletAddress')
      setToken(null)
      setWalletAddress()
    },
  });
}

const App = () => {
  const [lastestUpdate, setLast] = useState()
  const [tokenList, setTokenList] = useState(localStorage.getItem('tokenList'))
  let [dataList, setDataList] = useState([])

  const handletokenInput = async (e) => {
    const { value } = e.target
    if (value.length < 256) return
    try {
      const { publicAddress } = jwt.decode(value)
      let tokenListx = JSON.parse(tokenList)
      if (publicAddress) {
        if (!tokenListx) {
          let newList = JSON.stringify([{ token: value, addr: publicAddress }])
          localStorage.setItem('tokenList', newList)
          setTokenList(newList)
        } else {
          let isDuplicate = tokenListx.find(o => o.addr === publicAddress);
          if (isDuplicate) {
            tokenListx.find(o => o.addr === publicAddress).token = value;
            localStorage.setItem('tokenList', JSON.stringify(tokenListx))
            setTokenList(JSON.stringify(tokenListx))
          } else {
            tokenListx.push({ token: value, addr: publicAddress })
            localStorage.setItem('tokenList', JSON.stringify(tokenListx))
            setTokenList(JSON.stringify(tokenListx))
          }
        }
      }
    } catch (err) {
      console.log('invalid token')
      console.log(err)
    }
  }

  const fetchData = useCallback(async () => {
    const promises = JSON.parse(tokenList).map((ea) => getFarmInfo(ea))
    const data = await Promise.all(promises)
    setDataList(data)
    setLast(Date.now())
  }, [tokenList])

  const getFarmInfo = async (item) => {
    console.log(item)
    const { token, addr } = item
    try {
      const response = await axios.get('https://backend-farm-stg.plantvsundead.com/farms?limit=10&offset=0', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.status === 200) {
        const { data: { status, data } } = response
        console.log(data)
        return { addr, data, token, updateTime: Date.now() }
        // if (status === 0 && data.length > 0) {
        //   console.log(data)
        //   const hasCrow = await data.find(e => e.hasCrow)
        //   if (hasCrow) {
        //     console.log('อีกาไม่มา')
        //     if (Notification.permission === "granted") {
        //       new Notification(`อีกามา!!! (${walletAddress})`)
        //     }
        //     else if (Notification.permission !== "denied") {
        //       const permission = await Notification.requestPermission()
        //       if (permission === "granted") {
        //         console.log('อีกามา')
        //         new Notification(`อีกามา!!! (${walletAddress})`)
        //       }
        //     }
        //   } else console.log('ไม่มีอีกา')
        // }
      } else {
        message.error('Farm Maintenance', 5)
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาด', 5)
      console.error(error)
    }
  }

  const getTimeX = () => {
    if (!lastestUpdate) return 'N/A'
    const today = new Date(lastestUpdate);
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + ("0" + today.getSeconds()).slice(-2);
    return date + ' ' + time
  }

  useEffect(() => {
    let intx
    if (tokenList) {
      fetchData()
      intx = setInterval(() => {
        fetchData()
      }, 1000 * 60 * 5)
    }
    return () => {
      clearInterval(intx)
    }
  }, [fetchData, tokenList])

  return (
    <div className="App">
      <div>
        <h1>Crow Tracker</h1>
        <Input placeholder="Insert your token" onChange={handletokenInput} />
        {JSON.parse(tokenList) ? <div>Lastest update: {getTimeX()}</div> : null}
        <div>
          {JSON.parse(tokenList) && dataList ? dataList.map((acc) =>
            <div key={acc.addr}>
              <Card title={acc.addr.slice(0, 6) + '....' + acc.addr.substr(-4)} bordered={false} className={'acc-card'} >
                {(acc.hasOwnProperty("data")) ?
                  (<div>
                    {acc.data.map(ea =>
                      <div key={ea._id} className='plant-div' style={{ background: ea.hasOwnProperty("hasCrow") ? 'red' : 'transparent' }}>
                        <Avatar src={ea.plant.iconUrl} />
                        <div style={{ marginLeft: '12px' }}>
                          <div><b>Countdown: </b><Countdown date={new Date(ea.harvestTime)}>
                            Time to harvest!!!
                          </Countdown></div>
                          <div><b>Status: </b>{ea.stage}</div>
                        </div>
                      </div>)}</div>)
                  : (<div>Noo</div>)}
              </Card>
            </div>
          ) : (JSON.parse(tokenList) ? <Processing /> : null)}
        </div>
      </div>
    </div >
  )
}

export default App


