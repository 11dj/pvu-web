import { useEffect, useState } from 'react'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { 
  Input, 
  message,
  Modal
} from 'antd'
import { 
  ExclamationCircleOutlined 
} from '@ant-design/icons'
import Processing from './components/Processing'
import './App.css'

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
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [walletAddress, setWalletAddress] = useState(localStorage.getItem('walletAddress'))

  const onSearch = async (value) => {
    try {
      const { publicAddress } = jwt.decode(value)
      if (publicAddress) {
        setWalletAddress(publicAddress)
        localStorage.setItem('token', value)
        localStorage.setItem('walletAddress', publicAddress)
      }
      getFarmInfo(value)
    } catch (error) {
      message.error('ไม่พบข้อมูลของ token', 5)
    }
  }

  const getFarmInfo = async (value) => {
    try {
      const response = await axios.get('https://backend-farm-stg.plantvsundead.com/farms?limit=10&offset=0', {
        headers: { Authorization: `Bearer ${value || token}` }
      })
      if (response.status === 200) {
        const { data: { status, data } } = response
        if (status === 0 && data.length > 0) {
          const hasCrow = await data.find(e => e.hasCrow)
          if (hasCrow) {
            if (Notification.permission === "granted") {
              new Notification(`อีกามา!!! (${walletAddress})`)
            }
            else if (Notification.permission !== "denied") {
              const permission = await Notification.requestPermission()
              if (permission === "granted") {
                new Notification(`อีกามา!!! (${walletAddress})`)
              }
            }
          }
        }
      } else {
        message.error('Farm Maintenance', 5)
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาด', 5)
      console.error(error)
    }
  }

  useEffect(() => {
    getFarmInfo()
    const x = setInterval(() => {
      getFarmInfo()
    }, 1000 * 60 * 5)
    return () => {
      clearInterval(x)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="App">
      {!walletAddress ? (
        <>
          <h1>Crow Tracker</h1>
          <Search 
            placeholder="Token" 
            enterButton 
            onSearch={onSearch}
            style={{width: '40%'}} 
          />
        </>
      ) : (
        <div style={{width: '100%', textAlign: 'center'}}>
          <p className="token" onClick={() => showDeleteConfirm(setToken, setWalletAddress)}>{walletAddress}</p>
          <Processing />
        </div>
      )}
    </div>
  )
}

export default App


