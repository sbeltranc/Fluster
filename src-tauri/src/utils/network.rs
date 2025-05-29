use std::time::Duration;
use std::thread::{self, JoinHandle};
use std::sync::mpsc::{self, Sender, Receiver};
use std::net::{TcpListener, UdpSocket, Ipv4Addr, SocketAddr};

const MULTICAST_ADDR: Ipv4Addr = Ipv4Addr::new(239, 255, 42, 17);
const MULTICAST_PORT: u16 = 58432;
const BROADCAST_INTERVAL: Duration = Duration::from_secs(5);

pub mod lan_discovery {
    use super::*;

    pub struct Client {
        shutdown_tx: Sender<()>,
        discover_thread: JoinHandle<()>,
        pub receiver: Receiver<SocketAddr>,
    }
    
    pub struct UdpServer {
        shutdown_tx: Sender<()>,
        broadcast_thread: JoinHandle<()>,
        pub tcp_listener: TcpListener,
    }

    impl UdpServer {
        pub fn stop(self) {
            let _ = self.shutdown_tx.send(());
            let _ = self.broadcast_thread.join();
        }
    }

    impl Client {
        pub fn stop(self) {
            let _ = self.shutdown_tx.send(());
            let _ = self.discover_thread.join();
        }
    }

    pub fn start_server(port: u16) -> std::io::Result<UdpServer> {
        let tcp_listener = TcpListener::bind(("0.0.0.0", port))?;
        let actual_port = tcp_listener.local_addr()?.port();

        let udp_socket: UdpSocket = UdpSocket::bind("0.0.0.0:0")?;
        udp_socket.set_ttl(1)?;

        let (shutdown_tx, shutdown_rx) = mpsc::channel();

        let broadcast_thread = thread::spawn(move || {
            let destination = (MULTICAST_ADDR, MULTICAST_PORT);
            
            loop {
                if shutdown_rx.try_recv().is_ok() {
                    break;
                }

                let message = actual_port.to_string();
                if let Err(e) = udp_socket.send_to(message.as_bytes(), destination) {
                    break;
                }

                thread::sleep(BROADCAST_INTERVAL);
            }
        });

        Ok(UdpServer {
            shutdown_tx,
            broadcast_thread,
            tcp_listener,
        })
    }

    pub fn start_discovery() -> std::io::Result<Client> {
        let udp_socket = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, MULTICAST_PORT))?;
        
        udp_socket.join_multicast_v4(
            &MULTICAST_ADDR, 
            &Ipv4Addr::UNSPECIFIED
        )?;

        let (addr_tx, addr_rx) = mpsc::channel();
        let (shutdown_tx, shutdown_rx) = mpsc::channel();

        let discover_thread = thread::spawn(move || {
            let mut buf = [0; 1024];
            loop {
                if shutdown_rx.try_recv().is_ok() {
                    break;
                }

                match udp_socket.recv_from(&mut buf) {
                    Ok((size, src)) => {
                        let message = String::from_utf8_lossy(&buf[..size]);

                        if let Ok(port) = message.parse::<u16>() {
                            let addr = SocketAddr::new(src.ip(), port);
                            if let Err(e) = addr_tx.send(addr) {
                                break;
                            }
                        }
                    },
                    Err(e) => {
                        break;
                    }
                }
            }
        });

        Ok(Client {
            shutdown_tx,
            discover_thread,
            receiver: addr_rx,
        })
    }
}